/* global fetch, Request, Headers, chrome, localStorage */

const API = 'https://api.github.com/repos/'
const LI_TAG_ID = 'github-repo-size'
const GITHUB_TOKEN_KEY = 'x-github-token'

const storage = chrome.storage.sync || chrome.storage.local

let githubToken

const getRepoObject = () => {
  const currentURI = window.location.toString()

  if (!currentURI.match('pulls')) return false

  const repoUri = currentURI.replace(/^https?:\/\/github.com\//, '')
  const arr = repoUri.split('/')

  const userOrg = arr.shift()
  const repoName = arr.shift()
  const repo = `${userOrg}/${repoName}`

  arr.shift()

  const ref = arr.shift()

  return {
    repo
  }
}

const getSizeHTML = size => {
  const humanReadableSize = getHumanReadableSizeObject(size)

  return [
    `<li id="${LI_TAG_ID}">`,
    '<svg class="octicon octicon-database" aria-hidden="true" height="16" version="1.1" viewBox="0 0 12 16" width="12">',
    '<path d="M6 15c-3.31 0-6-.9-6-2v-2c0-.17.09-.34.21-.5.67.86 3 1.5 5.79 1.5s5.12-.64 5.79-1.5c.13.16.21.33.21.5v2c0 1.1-2.69 2-6 2zm0-4c-3.31 0-6-.9-6-2V7c0-.11.04-.21.09-.31.03-.06.07-.13.12-.19C.88 7.36 3.21 8 6 8s5.12-.64 5.79-1.5c.05.06.09.13.12.19.05.1.09.21.09.31v2c0 1.1-2.69 2-6 2zm0-4c-3.31 0-6-.9-6-2V3c0-1.1 2.69-2 6-2s6 .9 6 2v2c0 1.1-2.69 2-6 2zm0-5c-2.21 0-4 .45-4 1s1.79 1 4 1 4-.45 4-1-1.79-1-4-1z"></path>',
    '</svg>',
    `<span class="num text-emphasized"> ${humanReadableSize.size}</span> ${humanReadableSize.measure}`,
    '</li>'
  ].join('')
}

const checkStatus = response => {
  if (response.status >= 200 && response.status < 300) {
    return response
  }

  console.error(response)
  throw Error(`GitHub returned an invalid status: ${response.status}`)
}

const getAPIData = uri => {
  const headerObj = {
    'User-Agent': 'marceloalves/github-approval-count'
  }

  const token = localStorage.getItem(GITHUB_TOKEN_KEY) || githubToken

  if (token) {
    headerObj['Authorization'] = 'token ' + token
  }

  const request = new Request(`${API}${uri}`, {
    headers: new Headers(headerObj)
  })

  return fetch(request)
    .then(checkStatus)
    .then(response => response.json())
}

const checkPullRequestPage = async () => {
  const repo = getRepoObject()
  if (!repo) return

  const rows = document.querySelectorAll('.js-issue-row')
  if (rows.length === 0) return

  const approvals = {}

  for (let row of rows) {
    const pullId = row.id.split('_').pop()
    const reviews = await getAPIData(`${repo.repo}/pulls/${pullId}/reviews`)
    approvals[pullId] = 0
    if (reviews.length > 0) {
      const numberOfApprovals = reviews.filter(review => review.state === 'APPROVED').length
      approvals[pullId] = numberOfApprovals
    }
  }

  Object.keys(approvals).forEach(issueId => {
    const span = document.createElement('span')
    span.className = 'grid-col-3'
    span.innerHTML = `
      <svg class="octicon octicon-check text-green v-align-middle" viewBox="0 0 12 16" version="1.1" width="12" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M12 5l-8 8-4-4 1.5-1.5L4 10l6.5-6.5L12 5z"></path></svg>
      <span class="text-small text-bold">${approvals[issueId]}</span>
    `

    const element = document.querySelector(`#issue_${issueId} > div > div.col-3`)
    const lastElement = document.querySelector(`#issue_${issueId} > div > div.col-3 > span.grid-col-4`)
    element.insertBefore(span, lastElement)
  })
}

const loadFolderSizes = async () => {
  const files = document.querySelectorAll('table tbody tr.js-navigation-item:not(.up-tree) td.content a')
  const folderSizes = document.querySelectorAll('td.github-repo-size-folder > span')
  const liElem = document.getElementById(LI_TAG_ID)

  if (liElem) {
    liElem.onclick = null
    liElem.title = null
  }

  for (let folderSize of folderSizes) {
    folderSize.textContent = '...'
    folderSize.parentElement.onclick = null
  }

  const repoObj = getRepoObject()
  if (!repoObj) return

  const data = await getAPIData(`${repoObj.repo}/git/trees/${repoObj.ref}?recursive=1`)

  if (data.truncated) {
    console.warn('github-repo-size: Data truncated. Folder size info may be incomplete.')
  }

  const sizeObj = {}

  for (let item of data.tree) {
    if (!item.path.startsWith(repoObj.currentPath)) continue

    const arr = item.path
      .replace(new RegExp(`^${repoObj.currentPath}`), '')
      .replace(/^\//, '')
      .split('/')

    if (arr.length >= 2 && item.type === 'blob') {
      const dir = arr[0]
      if (sizeObj[dir] === undefined) sizeObj[dir] = 0
      sizeObj[dir] += item.size
    }
  }

  let i = 0

  for (const folderSize of folderSizes) {
    const t = sizeObj[getFileName(files[i++].text)]
    folderSize.textContent = getHumanReadableSize(t)
  }
}

storage.get(GITHUB_TOKEN_KEY, function(data) {
  githubToken = data[GITHUB_TOKEN_KEY]

  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes[GITHUB_TOKEN_KEY]) {
      githubToken = changes[GITHUB_TOKEN_KEY].newValue
    }
  })

  document.addEventListener('pjax:end', checkPullRequestPage, false)

  checkPullRequestPage()
})
