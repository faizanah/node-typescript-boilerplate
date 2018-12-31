let params = {body: {}, condition: {}, pick: {}}
export class PlacesController {
  constructor() {}
  create(req, res) {
    params.condition = {
      where: {googlePlaceId: req.body.googlePlaceId},
      defaults: {
        name: req.body.name,
        contact: req.body.contact,
        address: req.body.address,
        longitude: req.body.longitude,
        latitude: req.body.latitude
      }
    }
    req.model('Place').findOrCreate(params, (place, isNew) => {
      if (!isNew) {
        place.update(params.condition['defaults']).then(() => {
          res.ok(place)
        })
      }else {
        res.ok(place)
      }
    })
  }
  show(req, res) {
    params.condition = {where: {'$or': [{id: req.params.id}, {googlePlaceId: req.params.id}]}, include: [ {model: req.db['Review'], as: 'reviews', include: ['createdBy', 'attachments']} ]}
    return req.model('Place').findOne(params)
  }
  list(req, res) {
    params.condition = {}
    if (typeof(req.query['search']) !== 'undefined' && req.query['search'] !== '')
      params.condition = { where: {name: {$like: '%' + req.query.search + '%'} }}
    if (typeof(req.query['topSort']) !== 'undefined' && req.query['topSort'] !== '')
      params.condition['order'] = [ ['reviewsCount', req.query['topSort'] ]]
    if (typeof(params.condition['order']) !== 'undefined')
      params.condition['order'].push(['createdAt', 'ASC'])
    else
      params.condition['order'] = [['createdAt', 'ASC']]
    return req.model('Place').findAll(params)
  }
}
