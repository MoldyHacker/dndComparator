/*
*   dependencies
*/

const express = require('express')

/*
*   config - express
*/

const app = express()

/*
*   endpoint
*/

app.get('/', (request, response) => {
  response.send('Hello NodeJS!')
  console.log('Endpoint active');
})


/*
*   endpoint - posts
*/

app.get('/posts', (request, response) => {
  let posts = [
    {
      caption: 'The Green',
      location: 'Iceland'
    },
    {
      caption: 'The Ice',
      location: 'Greenland'
    }
  ]
  response.send(posts)
  console.log('Endpoint posts active');
})



/*
*   listen
*/

app.listen(3000)
