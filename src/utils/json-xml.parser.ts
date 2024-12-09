import jsontoxml = require('jsontoxml');
import { convertableToString, parseString } from 'xml2js';
import { promisify } from 'util';
import { AxiosResponse } from 'axios';

const promisifiedParseString: (arg1: convertableToString, arg2?: any) => Promise<unknown> = promisify(parseString);

export class Parser {
  static parseJSONBodyToXML(jsonArgument: JSON) {
    return jsontoxml(jsonArgument, { html: true });
  }

  static async convertXMLToJSON(xmlMessage: AxiosResponse) {
    const options = { trim: true, explicitArray: false, explicitRoot: false };
    return promisifiedParseString(xmlMessage.data, options);
  }

  static async convertXMLToJSONRaw(xmlMessage: string) {
    const options = { trim: true, explicitArray: false, explicitRoot: false };
    return promisifiedParseString(xmlMessage, options);
  }

  static removeSingleTagsFromXml(xmlMessage: AxiosResponse) {
    xmlMessage.data = xmlMessage.data.replace(/<[^>]+?\/>/g, '');
    return xmlMessage;
  }

  static async cleanAndParseJSON(jsonString: string) {
    const cleanString = jsonString.replace(/(\r\n|\n|\r|\t|\\)/gm, '');
    const jsonObject = JSON.parse(cleanString);
    return jsonObject;
  }
}
