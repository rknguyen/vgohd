const ENDPOINT = 'https://vangoghmuseum-assetserver.appspot.com/tiles'

const axios = require('axios')

const fetchDataId = require('./fetch_data_id')

async function fetchInfo(url) {
  const dataId = await fetchDataId(url)
  const imageInfo = await axios
    .get(ENDPOINT + '?id=' + dataId)
    .then((resp) => resp.data)
  return imageInfo
}

module.exports = fetchInfo
