'use strict'

const { Component } = require('@kravc/dos')

class AccountCredential extends Component {
  static get options() {
    return {
      issuerSeedHex: 'ad5bc1d9bb775e986b7bac4be2ac8baf570ed763eb137e9d453cfa7531c1770e'
    }
  }

  static async create(context, query, mutation) {
    const { identity: { id } } = context

    const createdAt    = new Date().toISOString()
    const { username } = mutation

    return { id, username, createdAt }
  }
}

module.exports = AccountCredential
