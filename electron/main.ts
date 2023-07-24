import { app, BrowserWindow } from 'electron'
import path from 'node:path'
import * as pdfjs from 'pdfjs-dist'

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
process.env.DIST = path.join(__dirname, '../dist')
process.env.PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

export const readPdf = async (pdfPath: string) => {
  return pdfjs.getDocument(pdfPath).promise.then(async (pdf) => {
    const maxPages = pdf.numPages;
    const countPromises = [];

    for (let j = 1; j <= maxPages; j += 1) {
      const page = pdf.getPage(j);

      const txt = "";
      countPromises.push(
        page.then(async (page) => {
          const textContent = await page.getTextContent();
          return textContent.items.map((s: any) => s.str).join('\n') as string;
        })
      );
    }

    return Promise.all(countPromises).then((texts) => {
      return texts.join('\n');
    })
  });
}

readPdf("./test.pdf").then((text) => {
  console.log(text);
})

let win: BrowserWindow | null
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(process.env.DIST, 'index.html'))
  }
}

app.on('window-all-closed', () => {
  win = null
})

app.whenReady().then(createWindow)
