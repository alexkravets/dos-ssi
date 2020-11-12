'use strict'

const issueCredential = require('./helpers/issueCredential')

const Credential = (Operation, options) => {
  return class extends Operation {
    static get outputSchema() {
      const schema = super.outputSchema

      return schema.extend({
        verifiableCredentialJson: {
          description: 'Verifiable credential containing operation response' +
            ' data as credential subject',
          format:      'json',
          required:    true
        }
      }, schema.id)
    }

    async exec(parameters) {
      const { result, ...rest } = await super.exec(parameters)

      const context       = this.context
      const { validator } = this.context
      const { outputSchema: schema } = this.constructor

      const { data: payload } = result
      result.verifiableCredentialJson = await issueCredential(payload, {
        ...options,
        schema,
        context,
        validator
      })

      return { result, ...rest }
    }
  }
}

module.exports = Credential
