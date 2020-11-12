'use strict'

const uniq        = require('lodash.uniq')
const { Schema }  = require('@kravc/schema')
const isUndefined = require('lodash.isundefined')

const getReferenceIds = (schema, schemasMap) => {
  let referenceIds = []

  const { jsonSchema } = schema
  const { id, enum: isEnum } = jsonSchema

  if (isEnum) { return [] }

  for (const propertyName in jsonSchema.properties) {
    const property = jsonSchema.properties[propertyName]

    const { $ref: refSchemaId, properties, items } = property

    const isArray     = property.type === 'array'
    const isObject    = property.type === 'object'
    const isReference = !isUndefined(refSchemaId)

    if (isReference) {
      const refJsonSchema      = schemasMap[refSchemaId]
      const nestedReferenceIds = getReferenceIds(refJsonSchema, schemasMap)

      referenceIds = referenceIds.concat([ refSchemaId, ...nestedReferenceIds ])

    } else if (isObject) {
      const nestedSchema = new Schema(properties, `${id}.${propertyName}.properties`)

      const nestedReferenceIds = getReferenceIds(nestedSchema, schemasMap)
      referenceIds = referenceIds.concat(nestedReferenceIds)

    } else if (isArray) {
      const itemProperties  = items.properties
      const itemRefSchemaId = items.$ref

      let itemJsonSchema

      if (itemRefSchemaId) {
        itemJsonSchema = schemasMap[itemRefSchemaId]
        const nestedReferenceIds = getReferenceIds(itemJsonSchema, schemasMap)

        referenceIds = referenceIds.concat([ itemRefSchemaId, ...nestedReferenceIds ])

      } else if (itemProperties) {
        const itemSchema = new Schema(itemProperties, `${id}.${propertyName}.items.properties`)

        const itemReferenceIds = getReferenceIds(itemSchema, schemasMap)
        referenceIds = referenceIds.concat(itemReferenceIds)

      }
    }
  }

  return uniq(referenceIds)
}

module.exports = getReferenceIds
