# Great Scott

[![NPM](https://nodei.co/npm/great-scott.png)](https://npmjs.org/package/great-scott)

Postgres data source library

### API

Optional properties

- `model` - A Immutable Data Record (see https://www.npmjs.com/package/immutable).
- `connectionStr` - A Postgres connection string (will default to the DATABASE_URL environment variable).

### Example Usage

```javascript

var GreatScott = require('great-scott');
var Avery = require('avery');

var UserModel = Avery.Model({

  name : 'User',

  defaults : {
    id : null,
    name : null,
  }

});

var UserDataSource = GreatScott.createDataSource({

  model : UserModel,

  findAllUsers : function() {

    var query = this.builder
      .select()
      .from('users');

    return this.execute(query);
  },

  createUser : function(userModel) {

    var query = this.builder
      .insert()
      .into('users')
      .setFields(userModel.toObject())
      .returning('*');

    return this.execute(query);
  }

});

UserDataSource.createUser(myUser)
.then(function(results) {
  console.log('success', results);
});

UserDataSource.findAllUsers()
.then(function(results) {
  console.log('success', results);
});

```
