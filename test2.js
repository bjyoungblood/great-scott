require('6to5/register');

var DataSource = require('./src/data-sources/postgres');
var Avery = require('../avery');

var CustomerModel = Avery.Model({

  name : 'Customer',

  defaults : {
    id : undefined,
    name : undefined,
    profile : {}
  }

});

var ProfileModel = Avery.Model({
  name : 'Profile',

  defaults : {
    id : undefined,
    customerId : undefined,
    thing : undefined,
  }
});

var HasOne = require('./src/data-sources/postgres/has-one');

class CustomerSource extends DataSource {
  constructor(...args) {
    super(...args);
    this.parsers = [
      new (require('./src/parsers/transform-errors'))(),
      new (require('./src/parsers/extract-relationships'))(this),
      new (require('./src/parsers/extract-rows'))(),
      new (require('./src/parsers/camel-case-attributes'))(),
      new (require('./src/parsers/to-model'))(this.model),
    ];

    this.relationships = {
      profile : new HasOne(this, {
        model : ProfileModel,
        table : 'profiles',
        farKey : 'customer_id'
      })
    }
  }

  find(id) {
    let query = this.builder
      .select()
      .from('ent_customer')
      .where('ent_customer.id = ?', id);

    return this.fetch(query, {
      withRelated : [ 'profile' ]
    });
  }
}

var dataSource = new CustomerSource({
  model : CustomerModel,
  tableName : 'ent_customer',
  connectionString : 'postgres://db:db@192.168.59.103/db',
});

dataSource.find('3a8bd387-3547-4611-8de6-52250d4cdc7b').then(function(customer) {
  console.log(customer[0].get('profile'));
});

// class UserDataSource extends DataSource {
//   constructor() {
//     super({
//       tableName : 'users',
//       model : UserModel,
//       connectionString : process.env.POSTGRES_URL,
//     });
//   }

//   // object to model with camel case keys
//   parse(row) {
//     return new this.model(_.transform(row, function(memo, val, key) {
//       memo[ _.camelCase(key) ] = val;
//       return memo;
//     }));
//   }

//   // model to object with snake case keys
//   format(model) {
//     var row = model.toObject();
//     return _.transform(row, function(memo, val, key) {
//       memo[ _.snakeCase(key) ] = val;
//       return memo;
//     });
//   }

//   findAll : function() {
//     var query = this.builder
//       .select()
//       .from('users');

//     return this.execute(query);
//   }

//   createUser(userModel) {
//     return this.insert(userMode);
//   }
// }

// UserDataSource.createUser(myUser)
// .then(function(results) {
//   console.log('success', results);
// });

// UserDataSource.findAllUsers()
// .then(function(results) {
//   console.log('success', results);
// });
