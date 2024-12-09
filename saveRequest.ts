import fs from 'fs';

export function writeLog(xml, name, type) {
  // Importa el módulo fs

  // Define la ruta del archivo de log
  const logPath = `./logs/${new Date().getTime()}-${name}${type}.txt`;

  // Escribe el mensaje en el archivo de log
  fs.appendFileSync(logPath, xml);
}
