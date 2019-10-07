const Schema = require("mongoose").Schema;
const Validator = require("validator");
const isEmpty = require("is-empty");

const ImageSchema = require('./image');
const Address = require('./address');

const OrganizationPublicFields = {
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
  },
  website: {
    type: String,
  },
  addresses: {
    type: [Address.schema],
  },
  logo: {
    type: ImageSchema,
  },
};

ContactInfoScheam = new Schema({
  type: {
    type: String,
    enum: ['email', 'wechat', 'tel', 'telegram', 'facebook', 'linkedin'],
    required: true
  },
  value: {
    type: String,
    required: true
  },
},{ _id : false });

const ContactInfoValidator = (contact) => {
  let errors = {};
  ['type', 'value'].map(
    field => {
      if (isEmpty(contact[field])) {
        errors[field] = "contact info " + field + " is required";
      }
    }
  );
  return {
    errors,
    isValid: isEmpty(errors)
  };
}

ContactSchma = new Schema({
  name: {
    type: String,
    required: true,
  },
  title: {
    type: String
  },
  contact_info: {
    type: [ContactInfoScheam]
  },
  // user id if the user is one of our members
  user_id: {
    type: String
  }
},{ _id : false });

const ContactValidator = (contact) => {
  let errors = {};
  ['name'].map(
    field => {
      if (isEmpty(contact[field])) {
        errors[field] = field + " field is required";
      }
    }
  );

  let isValid = isEmpty(errors);
  if (contact.contact_info.length > 0) {
    errors.contact_info = contact.contact_info.map(info => {
      const errRes = ContactInfoValidator(info)
      isValid = isValid && errRes.isValid;
      return errRes.errors;
    });
  }

  return {
    errors,
    isValid: isValid
  };
}

const OrganizationFields = {
  ...OrganizationPublicFields,
  type: {
    type: [String],
    enum: ['venue', 'project', 'community', 'capital', 'other'],
    requried: true
  },
  contacts: {
    type: [ContactSchma]
  },
  focused_area: {
    type: [String]
  },
  imgs: {
    type: [ImageSchema]
  },
  extra_fields: {}
};

const OrganizationValidator = (data) => {
  let errors = {};
  ['name', 'type'].map(
    (field) => {
      if (isEmpty(data[field])) {
        errors[field] = field + " field is required";
      }
    }
  );
  let isValid = isEmpty(errors);
  if (data.type.includes('venue')) {
    if (data.addresses.length === 0) {
      errors.addresses_all = "At least one address is required for veune org";
      isValid = false;
    } else {
      errors.addresses = data.addresses.map(address => {
        const addressError = Address.validator(address || {});
        isValid = isValid && addressError.isValid;
        return addressError.errors;
      });
    }
  }

  if (data.contacts.length > 0) {
    errors.contacts = data.contacts.map(contact => {
      const errRes = ContactValidator(contact);
      isValid = isValid && errRes.isValid;
      return errRes.errors;
    })
  }

  return {
    errors,
    isValid: isValid
  };
};

module.exports = {
  publicFields: OrganizationPublicFields,
  fields: OrganizationFields,
  validator: OrganizationValidator
}
