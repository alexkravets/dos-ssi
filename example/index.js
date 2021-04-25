'use strict'

const { Service } = require('@kravc/dos')

const URL = 'https://example.com/'
const api = [
  require('./components/AccountCredential'),
  require('./api/Credentials/CreateAccountCredential')
]

const service = new Service(api, URL, '/example')

module.exports = service
