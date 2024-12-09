import { promisify } from 'util';
import * as xml2js from 'xml2js';

export class FormatterHelper {
  private static parseXML = promisify(xml2js.parseString);

  public static async transformXMLtoJSON(xmlResponse: string): Promise<any> {
    try {
      // Parse the XML string to JavaScript object
      const parsedXml = await FormatterHelper.parseXML(xmlResponse);
      return parsedXml; // Devuelve el objeto JavaScript sin convertirlo a JSON
    } catch (error) {
      throw new Error(`Error parsing XML to JSON: ${error.message}`);
    }
  }
  public static async MapValuesFromXML(objeto: any, xml: string): Promise<any> {
    console.log('paso1');
    // Obtener las claves (nombres de variables) del objeto
    const keys = Object.keys(objeto);
    console.log('paso2');
    // Iterar sobre las claves y buscarlas en el XML
    keys.forEach((key) => {
      // Verificar si la propiedad es un array
      if (Array.isArray(objeto[key])) {
        // Si es un array, iterar sobre cada objeto dentro del array
        objeto[key].forEach((item: any) => {
          // Construir la expresión regular dinámicamente para buscar el nombre del elemento dentro del array en el XML
          const regexArray = new RegExp(`<.*:${key}>\\s*<(.*?)>(.*?)<\\/.*:${key}>`, 'gs');
          const matchArray = xml.match(regexArray);

          // Si se encuentra una coincidencia para el nombre del elemento del array
          if (matchArray && matchArray[1]) {
            const itemName = matchArray[1]; // Obtener el nombre del elemento dentro del array
            // Construir la expresión regular dinámicamente para buscar cada elemento dentro del array en el XML
            const regex = new RegExp(`<.*:${itemName}>(.*?)<\\/.*:${itemName}>`, 'gs');
            const match = xml.match(regex);

            // Si se encuentra una coincidencia, asignar el valor al objeto
            if (match && match[1]) {
              item[itemName] = match[1];
            }
          }
        });
      } else {
        // Si no es un array, construir la expresión regular dinámicamente para buscar la clave en el XML
        const regex = new RegExp(`<.*:${key}>(.*?)<\/.*:${key}>`);
        const match = xml.match(regex);

        // Si se encuentra una coincidencia, asignar el valor al objeto
        if (match && match[1]) {
          objeto[key] = match[1];
        }
      }
    });

    return objeto;
  }

  public static async clearPrefixXML(xml: string): Promise<string> {
    // Expresión regular para limpiar los prefijos a: y b: en nombres de etiquetas y valores
    const regex = /<(\/?)(?:a:|b:)?([^>\s]+)([^>]*)>/g;

    // Reemplazar los prefijos en el XML
    const xmlLimpio = xml.replace(regex, '<$1$2$3>');

    return xmlLimpio;
  }
  public static logJSONObject(obj: any, indentLevel = 0): void {
    const spaces = ' '.repeat(indentLevel * 2);
    if (typeof obj === 'object' && obj !== null) {
      if (Array.isArray(obj)) {
        console.log(spaces + '[');
        for (const item of obj) {
          FormatterHelper.logJSONObject(item, indentLevel + 1);
        }
        console.log(spaces + ']');
      } else {
        console.log(spaces + '{');
        for (const key in obj) {
          console.log(spaces + `  "${key}":`);
          FormatterHelper.logJSONObject(obj[key], indentLevel + 1);
        }
        console.log(spaces + '}');
      }
    } else {
      console.log(spaces + JSON.stringify(obj));
    }
  }
}
