'use strict'

const keyBy      = require('lodash.keyby')
const { expect } = require('chai')
const { Schema } = require('@kravc/schema')
const getReferenceIds = require('./getReferenceIds')

const documentSchema = new Schema({
  number: { required: true }
}, 'Document')

const playerSchema = new Schema({
  id:                {},
  tags:              { items: {} },
  hasVideoGameScore: { items: { $ref: 'VideoGameScore' }, required: true },
  profile: {
    properties: {
      name: {},
      attachements: {
        items: {
          properties: {
            url: {},
            document: {
              $ref: 'Document'
            }
          }
        }
      }
    }
  }
}, 'Player')

const videoGameSchema = new Schema({
  id:      {},
  name:    { type: 'string', required: true },
  version: { type: 'string', required: true }
}, 'VideoGame', 'https://schema.org')

const difficultyLevelSchema = new Schema({
  enum: [ 'Easy', 'Medium', 'Hard' ]
}, 'DifficultyLevel')

const videoGameScoreSchema = new Schema({
  game:            { $ref: 'VideoGame', required: true },
  bestRoundTime:   { type: 'integer', required: true },
  difficultyLevel: { $ref: 'DifficultyLevel', required: true }
}, 'VideoGameScore')

const schemasMap = keyBy([
  playerSchema,
  documentSchema,
  videoGameSchema,
  videoGameScoreSchema,
  difficultyLevelSchema
], 'id')

describe('getReferenceIds(schema, schemasMap)', () => {
  it('returns a list of schema IDs referenced by the selected one', async () => {
    const ids = getReferenceIds(playerSchema, schemasMap)

    expect(ids).to.include('Document')
    expect(ids).to.include('VideoGame')
    expect(ids).to.include('VideoGameScore')
    expect(ids).to.include('DifficultyLevel')
  })
})
