'use strict'

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
    getCredentialId,
    credentialTypeUri
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

  const identity = await Identity.fromSeed(issuerSeedHex)
  const factory  = new CredentialFactory(credentialTypeUri, types)

  const id = getCredentialId(payload)
  const { identity: { id: holderId } } = context

  const credential = await factory.createCredential(id, holderId, payload)
  const verifiableCredential = await identity.issue(credential)
  const verifiableCredentialJson = canonicalize(verifiableCredential)

  return verifiableCredentialJson
}

module.exports = issueCredential
