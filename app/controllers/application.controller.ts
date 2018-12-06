const _ = require('lodash')
import db from '../models/'
import  {ErrorHandling} from '../config/errorHandling'

let model = ''
class ApplicationController {
  errors: any
  private errorHandler
  constructor(m) {
    console.log(m)
    model = m
    this.errorHandler = new ErrorHandling()
  }
  _create(req, res, options = {}, callback = null) {
    req.getValidationResult()
      .then(function(result) {
        if (result.isEmpty()) {
          req.body = _.pick(_.cloneDeep(req.body), req.pick || [])
          return db[model].create(req.body)
            .then(appuser => res.status(201).send({success: true, data: appuser, message: options['message'] || 'Successfully Created'}))
            .catch(error => this.errorHandler.sequelizer(res, error) )
        } else {
          this.errorHandler.validations(res, result)
        }
      })
  }
  _list(req, res, options = {}, callback = null) {
    return db[model].findAll({ include: [{ all: true }] }).then(data =>
      res.status(200).send({success: true, data: data}))
      .catch(error => this.errorHandler.sequelizer(res, error) )
  }
  _findOne(req, res, callback = null) {
    req.getValidationResult().then(function(result) {
        if (result.isEmpty()) {
            db[model].findOne(req.condition || {}).then(data => {
                if (typeof(callback) === 'function')
                  callback(data)
                else
                  res.status(200).send(data)
              }
            ).catch(error => this.errorHandler.sequelizer(res, error) )
          } else {
          this.errorHandler.validations(res, result)
        }
      })
  }
  _findOrCreate(req, res, options = {}, callback = null) {
    req.getValidationResult().then((result) => {
      if (result.isEmpty()) {
        return db[model].findOrCreate(req.condition || {}).spread((data, created) => {
          if (typeof(callback) === 'function')
            callback(data, created)
          else
            res.status(200).send({success: true, data: data, message: created ? 'Successfully Created' : 'Successfully Reterived'})
        }).catch(error => this.errorHandler.sequelizer(res, error) )
      }else {
        this.errorHandler.validations(res, result)
      }
    })
  }
  private isCallback(cb) {
    return typeof(cb) === 'function'
  }
  private model() {
    return db[model]
  }
}

export default ApplicationController
