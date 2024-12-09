import { parseString } from 'xml2js';

export class ErrorHelper {
  // Busca errores en las respuestas XML
  static Search(xml: string) {
    const regexExceptionCode = /<.*:ExceptionCode>(.*?)<\/.*:ExceptionCode>/;
    const regexExceptionDescription = /<.*:ExceptionDescription>(.*?)<\/.*:ExceptionDescription>/;

    const exceptionCodeMatch = xml.match(regexExceptionCode);
    const exceptionDescriptionMatch = xml.match(regexExceptionDescription);

    if (exceptionCodeMatch && exceptionCodeMatch.length > 1) {
      const exceptionCode = parseInt(exceptionCodeMatch[1]);
      const exceptionDescription = exceptionDescriptionMatch ? exceptionDescriptionMatch[1] : 'No description';

      if (exceptionCode !== 0) {
        throw new Error(`Radix Exception: Code ${exceptionCode} Description: ${exceptionDescription}`);
      }
    }
  }
}
