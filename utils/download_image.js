const fs = require('fs')
const path = require('path')
const axios = require('axios')
const { v4: uuidv4 } = require('uuid')

function downloadImage(url) {
  return new Promise((resolve) => {
    const filePath = path.resolve(__dirname, '../tmp/', uuidv4() + '.jpg')
    const createFileStream = fs.createWriteStream(filePath)

    axios({
      url,
      method: 'GET',
      responseType: 'stream'
    }).then((response) => {
      response.data.pipe(createFileStream).on('finish', () => {
        resolve(filePath)
      })
    })
  })
}

module.exports = downloadImage
