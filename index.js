const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const inquirer = require('inquirer')
const sizeOf = require('image-size')
const { v4: uuidv4 } = require('uuid')
const mergeImage = require('merge-images')
const { createCanvas, Image } = require('canvas')

const fetchImageInfo = require('./utils/fetch_info')
const downloadImage = require('./utils/download_image')

const URL_REGEX = /https:\/\/www.vangoghmuseum.nl\/en\/collection\/([a-z,A-Z,0-9]{0,})/

async function bootstrap() {
  const { url } = await inquirer.prompt([
    {
      name: 'url',
      type: 'input',
      message: 'Vangogh museum image link'
    }
  ])

  if (!URL_REGEX.test(url)) {
    console.log(
      chalk.red(
        'URL is not correct! Example: https://www.vangoghmuseum.nl/en/collection/s0176V1962'
      )
    )
    process.exit(1)
  }

  const imageInfo = await fetchImageInfo(url)

  const { size: sizeId } = await inquirer.prompt([
    {
      name: 'size',
      type: 'list',
      message: 'Image size',
      choices: imageInfo.levels.map((sz, id) => ({
        name: sz.width + 'x' + sz.height,
        value: id
      }))
    }
  ])

  const image = imageInfo.levels[sizeId]
  let { tiles } = image

  const nRows = Math.max(...tiles.map((tile) => tile.y)) + 1
  const mCols = Math.max(...tiles.map((tile) => tile.x)) + 1

  const arr = new Array(nRows)
  for (let i = 0, l = nRows; i < l; ++i) {
    arr[i] = new Array(mCols)
  }

  console.log(chalk.blue('> Downloading image...'))

  let processCnt = 0
  let taskQueue = []
  for (let i = 0, l = tiles.length; i < l; ++i) {
    taskQueue.push(
      downloadImage(tiles[i].url).then((imagePath) => {
        processCnt++
        tiles[i].src = imagePath
        console.log(chalk.blue(`> Downloaded ${processCnt}/${l}`))
      })
    )
  }

  await Promise.all(taskQueue)

  for (let i = 0, l = tiles.length; i < l; ++i) {
    const { x: y, y: x } = tiles[i]
    arr[x][y] = { id: i, x, y, ...sizeOf(tiles[i].src) }
  }

  for (let i = 0; i < nRows; ++i) {
    for (let j = 0; j < mCols; ++j) {
      if (i === 0 && j === 0) continue
      if (j > 0) arr[i][j].x = arr[i][j - 1].x + arr[i][j - 1].width
      if (i > 0) arr[i][j].y = arr[i - 1][j].y + arr[i - 1][j].height
      tiles[arr[i][j].id].x = arr[i][j].x
      tiles[arr[i][j].id].y = arr[i][j].y
    }
  }

  console.log(chalk.blue('> Combining image...'))

  const base64Image = await mergeImage(tiles, {
    Canvas: createCanvas,
    Image: Image,
    width: image.width,
    height: image.height,
    crossOrigin: 'Anonymous',
    quality: 1.0
  }).then((b64) => b64.replace(/^data:image\/png;base64,/, ''))

  console.log(chalk.blue('> Cleaning temp file...'))

  for (let i = 0, l = tiles.length; i < l; ++i) {
    fs.unlinkSync(tiles[i].src)
  }

  console.log(chalk.blue('> Saving image...'))

  const imagePath = path.resolve(__dirname, 'tmp', uuidv4() + '.jpg')
  fs.writeFileSync(imagePath, base64Image, 'base64')

  console.log(chalk.green('> Your image saved at ' + imagePath))
}

bootstrap()
