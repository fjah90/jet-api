import { Parser } from './json-xml.parser';

export class Formatter {
  static convertJSONToSoapRequest(jsonArguments, rad1Schema, rad1SchemaSecondProperty = '') {
    const soapBody = Parser.parseJSONBodyToXML(jsonArguments);

    return `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/" xmlns:rad="http://schemas.datacontract.org/2004/07/Radixx.ConnectPoint.Request"  xmlns:arr="http://schemas.microsoft.com/2003/10/Serialization/Arrays" xmlns:rad1="http://schemas.datacontract.org/2004/07/Radixx.ConnectPoint.${rad1Schema}.Request${
      rad1SchemaSecondProperty ? `.${rad1SchemaSecondProperty}` : ''
    }">
        <soapenv:Header/>
        <soapenv:Body>
          ${soapBody}
        </soapenv:Body>
      </soapenv:Envelope>`;
  }

  static convertJSONToSoapRequestCustomSchemas(jsonArguments, schemas) {
    const soapBody = Parser.parseJSONBodyToXML(jsonArguments);

    return `<soapenv:Envelope ${schemas}
      >\n
        <soapenv:Header/>\
        <soapenv:Body>\
          ${soapBody}\
        </soapenv:Body>\
      </soapenv:Envelope>`;
  }

  static forceArray(object): any[] {
    return Array.isArray(object) ? object : [object];
  }

  static JSONPropertiesToLowerCamel(o: any): any {
    if (Array.isArray(o)) {
      return o.map((value) => this.JSONPropertiesToLowerCamel(value));
    } else if (o !== null && typeof o === 'object') {
      const newO = {};
      for (const [origKey, value] of Object.entries(o)) {
        const firstTwoChars = origKey.slice(0, 2);
        const newKey = firstTwoChars === firstTwoChars.toUpperCase() ? origKey : origKey.charAt(0).toLowerCase() + origKey.slice(1);
        const newValue = this.JSONPropertiesToLowerCamel(value);
        newO[newKey] = typeof newValue === 'string' && newValue.length === 0 ? null : newValue;
      }
      return newO;
    } else {
      return o;
    }
  }
}
