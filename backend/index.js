/*
*   dependencies
*/

const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

/*
*   config - express
*/

const app = express()

/*
*   config - cors
*/

app.use(cors());

/*
*   functions - fetching
*/

async function fetchPage(url) {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching the page:',error);
    return null;
  }
}

/*
*   functions - Parsing hierarchical structure
*   TODO: 1. Add parsing support to 'explode' tables. I have a table parsing function below, just need to integrate it.
*   TODO: 1.5. Maybe group clusters of UL's into a single structure within their hierarchy
*   TODO: 2. This currently only supports races from dnd5e.wikidot.com
*   TODO: 3. Make another function to identify the differences between
*    races/species(url - lineage:value), classes(no category?), backgrounds(url - background:value), feats(url - feat:value), etc
*/

function parseToHierarchy(html) {
  const $ = cheerio.load(html);
  const hierarchy = {};
  
  // Extract the main-content 'Cheerio Object'
  const $mainContent = $('div.main-content')
  
  // Extract the title from div.page-title.page-header
  hierarchy.title = $mainContent.find('div.page-title.page-header span').text().trim();
  
  // Initialize a section for the main content
  hierarchy.content = [];
  
  // Process the children of div#page-content
  $mainContent.find('div#page-content').children().each((index, element) => {
    const tagName = $(element).get(0).tagName.toLowerCase();
    
    // Check if the element is a heading
    if (tagName.match(/^h[1-6]$/)) {
      // If it's a heading, start a new section
      const currentSection = {
        tag: tagName,
        id: $(element).attr('id'), // Capture the ID if present
        title: $(element).text(),
        content: []
      };
      hierarchy.content.push(currentSection);
    } else if (hierarchy.content.length > 0) {
      // Add content to the most recent section
      const currentSection = hierarchy.content[hierarchy.content.length - 1];
      currentSection.content.push({
        tag: tagName,
        html: $(element).html()
      });
    }
  });
  
  return hierarchy;
}

/*
*   functions - parsing tables
*/

function parseDataTable(html) {
  const $ = cheerio.load(html);
  const data = {};
  
  $('table').each((index, element) => {
    // Find the preceding <p> element for the table name
    const tableName = $(element).prev('p').text().trim();
    
    // Extract data from the table
    const tableData = [];
    $(element).find('tr').each((i, row) => {
      const rowData = {};
      $(row).find('td, th').each((j, cell) => {
        rowData[`column${j}`] = $(cell).text().trim();
      });
      tableData.push(rowData);
    });
    
    // Use the table name as the key if it exists, or a default name
    data[tableName || `table${index}`] = tableData;
  });
  
  return data;
}

/*
*   functions - scraping
*/

async function scrapeData(url) {
  const html = await fetchPage(url);
  if (html) {
    // const html = '<h1 id="toc">Title</h1><p>Some text</p>';
    return parseToHierarchy(html);
  }
  return null;
}

/*
*   endpoint - opening
*/

app.get('/', (request, response) => {
  response.send('Hello NodeJS!')
  console.log('Endpoint active');
})

/*
*   endpoint - scrape
*/

app.get('/scrape', async (req, res) => {
  const url = req.query.url; // get url from query parameters -> ?url=value
  
  scrapeData(url)
    .then((data) => {res.json({ data: data })})
    .catch((error) => {res.status(500).send('Error occurred while scraping: ' + error)});
  console.log(`URL: ${url} scraped`);
})

/*
*   listen
*/

app.listen(3000)
