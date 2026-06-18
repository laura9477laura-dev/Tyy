const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { spawn } = require('child_process')
const { fileTypeFromBuffer } = require('file-type')
const webp = require('node-webpmux')
const fetch = require('node-fetch')
const ffmpeg = require('fluent-ffmpeg')
const { writeExifImg } = require('./exif')

const tmp = path.join(__dirname, '../tmp')

/**
 * Image/Video to Sticker
 * @param {Buffer} img Image/Video Buffer
 * @param {String} url Image/Video URL
 * @param {String} packname EXIF Packname
 * @param {String} author EXIF Author
 */
async function sticker(img, url, packname, author) {
    try {
        let buffer = img;
        if (url) {
            const response = await fetch(url);
            buffer = await response.buffer();
        }
        
        const stickerBuffer = await writeExifImg(buffer, {
            packname: packname || 'LIO BOT',
            author: author || '@evans'
        });
        
        return stickerBuffer;
    } catch (error) {
        console.error('Erreur lors de la création du sticker:', error);
        return null;
    }
}

async function sticker5(img, url, packname, author, categories = [''], extra = {}) {
  const { Sticker } = await import('wa-sticker-formatter')
  const stickerMetadata = {
    type: 'default',
    pack: packname,
    author,
    categories,
    ...extra
  }
  return (new Sticker(img ? img : url, stickerMetadata)).toBuffer()
}

const support = {
  ffmpeg: true,
  ffprobe: true,
  ffmpegWebp: true,
  convert: true,
  magick: false,
  gm: false,
  find: false
}

module.exports = {
  sticker,
  sticker5,
  support
}