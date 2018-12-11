'use strict'
import db from './'
module.exports = function(sequelize, DataTypes) {
  const Review = sequelize.define('Review', {
    id: {
      allowNull: false,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    isLiked: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    createdById: {
      type: DataTypes.UUID,
      allowNull: false
      // references: {
      //   model: 'User',
      //   key: 'id'
      // }
    },
    placeId: {
      type: DataTypes.UUID,
      allowNull: false
      // references: {
      //   model: 'Place',
      //   key: 'id'
      // }
    }
  }, {

    // indexes: [{unique: true, fields: ['createdById', 'placeId']}],
    timestamps: true,
    freezeTableName: true,
    tableName: 'reviews'

  })
  Review.associate = function(models) {
    Review.belongsTo(models.Place , { as: 'place' , foreignKey: 'placeId' })
    Review.belongsTo(models.User , { as: 'createdBy', foreignKey: 'createdById' })
  }
  Review.afterSave((review, options) => {
    const pId = review.placeId
    let query = 'select count(b.id) as reviewsCount, (select count(a.id) from reviews a where a.isLiked = true and a.placeId = "' + pId + '") as likesCount from reviews b where b.placeId = "' + pId + '" limit 1'
    sequelize.query(query).spread((results, metadata) => {
      console.log(results)
      query = 'UPDATE places SET reviewsCount = ' + results[0].reviewsCount + ', likesCount = ' + results[0]['likesCount'] + ', dislikesCount = ' + (results[0]['reviewsCount'] - results[0]['likesCount']) + ' WHERE places.id = "' + pId + '";'
      sequelize.query(query).spread((data, metadata) => {
        console.log(data)
      })
    })
  })
  return Review
}