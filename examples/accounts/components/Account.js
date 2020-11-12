'use strict'

const { Component } = require('@kravc/dos')

class Account extends Component {
  static async create(context, query, mutation) {
    const { identity: { id } } = context

    const createdAt    = new Date().toISOString()
    const { username } = mutation

    return { id, username, createdAt }
  }
}

module.exports = Account
