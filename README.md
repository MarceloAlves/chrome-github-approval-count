## Chrome Extension - GitHub Pull Request Approval Count

![chrome store](https://img.shields.io/chrome-web-store/v/mioahlnpgdafifikokdnibkagbmedngo?color=green&style=flat-square)

Adds the number of PR approvals when browsing the list

## Screenshot

![GitHub Approval Count Screenshot](https://raw.githubusercontent.com/MarceloAlves/chrome-github-approval-count/master/screenshot.png)

## Private Repository

To enable viewing size of private repositories:

1. Install extension from Chrome Web Store
2. Go to https://github.com/settings/tokens to generate your personal access token.

   - Check `repo` scope to enable this extension on private repo.

3. Click on the GitHub Approval Count extension's (![extension icon](https://raw.githubusercontent.com/MarceloAlves/chrome-github-approval-count/master/icons/gha16.png)) icon
4. Paste your access token in the prompt

## Development

1. Clone this repo
2. Open Chrome Extensions [chrome://extensions](chrome://extensions)
3. Enable Developer Mode
4. Click on load unpacked extension and select this cloned repo

## Inspiration

- [@jasonsoares](https://github.com/jasonsoares) had the idea
- Borrowed heavily from [harshjv/github-repo-size](https://github.com/harshjv/github-repo-size)

## License

MIT
