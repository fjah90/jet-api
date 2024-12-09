interface Destination {
  destinationAirportCode: string;
  destinationAirportName?: string;
  destinationAirportDescription?: string;
  destinationAirportCountryCode: string;
}

interface Airport {
  originAirportCode: string;
  originAirportDescription?: string;
  originAirportAirportName?: string;
  originAirportCountryCode: string;
  destinations: Destination[];
}

export const sortAirportsByOriginAndDestinationName = (airports: Airport[]): Airport[] => {
  const sortedAirports = airports.sort((a, b) => a.originAirportAirportName.localeCompare(b.originAirportAirportName));

  for (const airport of sortedAirports) {
    airport.destinations = airport.destinations.sort((a, b) =>
      a.destinationAirportName.localeCompare(b.destinationAirportName)
    );
  }

  return sortedAirports;
};
