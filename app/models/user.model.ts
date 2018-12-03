import {createJWToken} from '../config/auth'
import { Mailer, environment } from '../config/'
import * as bcrypt from 'bcrypt'
import * as crypto from 'crypto'
const mailer = new Mailer()
module.exports = function(sequelize, DataTypes) {
  const User = sequelize.define('User', {
    id: {
      allowNull: false,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV1,
      primaryKey: true
    },
    fullName: {
      allowNull: false,
      type: DataTypes.STRING
    },
    avatar: {
      type: DataTypes.STRING
    },
    phone: {
      type: DataTypes.STRING
    },
    password: {
      allowNull: false,
      type: DataTypes.STRING,
      validate: {
        notEmpty: true,
        len: [6, 100]
      }
    },
    resetToken: {
      type: DataTypes.STRING
    },
    resetTokenSentAt: {
      type: DataTypes.DATE,
      validate: {
        isDate: true
      }
    },
    resetTokenExpireAt: {
      type: DataTypes.DATE,
      validate: {
        isDate: true
      }
    },
    email: {
      allowNull: false,
      type: DataTypes.STRING,
      validate: {
        len: {
          args: [6, 128],
          msg: 'Email address must be between 6 and 128 characters in length'
        },
        isEmail: {
          msg: 'Email address must be valid'
        }
      }
    },
      status: {
        allowNull: false,
        type:   DataTypes.ENUM,
        values: ['pending' , 'accepted'],
        defaultValue: 'pending',
        validate: {
          isIn: {
            args: [['pending' , 'accepted']],
            msg: 'Invalid status.'
          }
        }
      }
  }, {
    indexes: [{unique: true, fields: ['email']}],
    timestamps: true,
    freezeTableName: true,
    tableName: 'users'
  })

  User.beforeSave((user, options) => {
    if (user.changed('password')) {
      user.password = bcrypt.hashSync(user.password, bcrypt.genSaltSync(10), null)
    }
  })

  User.prototype.generateToken = function generateToken() {
    return createJWToken({ email: this.email, id: this.id})
  }

  User.prototype.sendResetPasswordInstructions = function sendResetPasswordInstructions() {
    const user = this
    crypto.randomBytes(20, function (err, buf) {
      user.updateAttributes({
        resetToken: buf.toString('hex'),
        resetTokenExpireAt: Date.now() + 3600000,
        resetTokenSentAt: Date.now()
      }).then(function (result) {
        const options = {
          to: result.email,
          subject: 'Reset Password Instructions ✔',
          template: 'forgot-password-email',
          context: {
            url: `${environment.host}/password/reset/` + result.resetToken,
            user: result
          }
        }
        return mailer.send(options)
      }).catch(function (error) {
        console.log(JSON.stringify(error, null, 2))
      })
    })
  }

  User.prototype.authenticate = function authenticate(value) {
    if (bcrypt.compareSync(value, this.password))
      return this
    else
      return false
  }
  return User
}
