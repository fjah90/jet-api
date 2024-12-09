class Agent {
  IataCode: string;
  UserId: string;
  Username: string;
  Country: string;
  FirstName: string;
  LastName: string;
  Address: string;
  Address1: string;
  City: string;
  EmailAddress: string;
  PostalCode: string;
  State: string;
  Status: number;
  TelephoneNumber: string;
  MobileNumber: string;
}

class Exception {
  ExceptionCode: number;
  ExceptionDescription: string;
  ExceptionSource: string;
  ExceptionLevel: string;
}

class RetrieveAgentListResponse {
  ViewAgents: Agent[];
  Exceptions: Exception[];
}
