'use strict'

const get          = require('lodash.get')
const { ulid }     = require('ulid')
const { Identity } = require('@kravc/identity')
const canonicalize = require('canonicalize')
const { Schema, CredentialFactory } = require('@kravc/schema')

const issueCredential = async (payload, options) => {
  const {
    typesMap = {},
    schema,
    context,
    validator,
    issuerSeedHex,
    getHolderId       = (context, payload) => get(context, 'identity.id', 'did:key:EXAMPLE_HOLDER_ID'), // eslint-disable-line
    getCredentialId   = (context, payload) => 'https://example.com/credentials/' + ulid(), // eslint-disable-line
    credentialTypeUri = `https://example.com/schemas/${schema.id}`
  } = options

  let referenceIds     = validator.getReferenceIds(schema.id)
  const { schemasMap } = validator

  const { $ref } = schema.source.data

  let source

  if ($ref) {
    source = schemasMap[$ref]
    referenceIds = referenceIds.filter(id => id !== $ref)

  } else {
    source = schema.source.data.properties

  }

  const rootSchema = new Schema(source, 'CredentialSubject')
  /* istanbul ignore next */
  const referenceSchemas = referenceIds.map(id => schemasMap[id])

  const types = [ rootSchema, ...referenceSchemas ].map(({ id, source }) => {
    const vocabUri = typesMap[id] || credentialTypeUri

    return new Schema(source, id, vocabUri)
  })

  const factory = new CredentialFactory(credentialTypeUri, types)

  const id       = getCredentialId(context, payload)
  const holderId = getHolderId(context, payload)

  let verifiableCredential = await factory.createCredential(id, holderId, payload)

  if (issuerSeedHex) {
    const identity = await Identity.fromSeed(issuerSeedHex)
    verifiableCredential = await identity.issue(verifiableCredential)
  }

  const verifiableCredentialJson = canonicalize(verifiableCredential)

  return verifiableCredentialJson
}

module.exports = issueCredential
