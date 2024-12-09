import { parseString } from 'xml2js';

export class ParserHelper {
  public static mapXmlToAgentList(xmlString: string): Promise<RetrieveAgentListResponse> {
    return new Promise((resolve, reject) => {
      parseString(xmlString, (err, result) => {
        if (err) {
          reject(err);
          return;
        }

        // Extrayendo la información de ViewAgents y Exceptions
        const viewAgents =
          result['s:Envelope']['s:Body']['RetrieveAgentListResponse']['RetrieveAgentListResult']['ViewAgents'][
            'ViewAgent'
          ];
        const exceptionInfo =
          result['s:Envelope']['s:Body'][0]['RetrieveAgentListResponse'][0]['RetrieveAgentListResult'][0][
            'Exceptions'
          ][0]['ExceptionInformation'][0];

        viewAgents.forEach((agent) => {
          console.log('adentro');
          console.log(`IataCode: ${agent.IataCode[0]}, UserId: ${agent.UserId[0]}, Country: ${agent.Country[0]}`);
        });
        // Mapeando agentes
        const agents: Agent[] = viewAgents.map((agentData: any) => {
          const agent = new Agent();
          agent.IataCode = agentData['IataCode'][0];
          agent.UserId = agentData['UserId'][0];
          agent.Username = agentData['Username'][0];
          agent.Country = agentData['Country'][0];
          agent.FirstName = agentData['FirstName'][0];
          agent.LastName = agentData['LastName'][0];
          agent.Address = agentData['Address'][0];
          agent.Address1 = agentData['Address1'][0];
          agent.City = agentData['City'][0];
          agent.EmailAddress = agentData['EmailAddress'][0];
          agent.PostalCode = agentData['PostalCode'][0];
          agent.State = agentData['State'][0];
          agent.Status = parseInt(agentData['Status'][0]);
          agent.TelephoneNumber = agentData['TelephoneNumber'][0];
          agent.MobileNumber = agentData['MobileNumber'][0];
          return agent;
        });

        // Mapeando excepciones
        const exception: Exception = {
          ExceptionCode: parseInt(exceptionInfo['ExceptionCode'][0]),
          ExceptionDescription: exceptionInfo['ExceptionDescription'][0],
          ExceptionSource: exceptionInfo['ExceptionSource'][0],
          ExceptionLevel: exceptionInfo['ExceptionLevel'][0],
        };

        // Creando objeto de respuesta
        const response: RetrieveAgentListResponse = {
          ViewAgents: agents,
          Exceptions: [exception],
        };

        resolve(response);
      });
    });
  }
}
