export const getPassengerDescription = (ageOfPassenger: number, ageOfOtherPassengers: number[]) => {
  let result: string;

  // Check if the age is less than 2 (bebe)
  if (ageOfPassenger < 2) {
    result = '4';
  } else {
    // Check if there's a bebe in the age array
    const hasBebe = ageOfOtherPassengers.some((age) => age < 2);

    if (hasBebe) {
      result = '6';
    } else {
      // Check if the age is less than 18 (niño) or greater or equal than 18 (adulto)
      result = ageOfPassenger < 18 ? '3' : '0';
    }
  }

  return result;
};
