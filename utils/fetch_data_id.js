const axios = require('axios')

async function fetchDataId(url) {
  const html = await axios.get(url).then((resp) => resp.data)
  const [, dataId] = /data-id="([0-9]{0,})?"/gi.exec(html)
  return dataId
}

module.exports = fetchDataId
