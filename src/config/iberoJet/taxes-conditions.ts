export enum ExtrasTypes {
  CHECKSIMPLE = 'checkSimple',
  COUNTERSIMPLE = 'counterSimple',
  COUNTERDROPDOWN = 'counterDropdown',
  OPTIONDROPDOWN = 'optionDropdown',
  SELECTION = 'selection',
  COUNTERMULTIPLE = 'counterMultiple',
}

export const ExtrasCondition = {
  create: [
    {
      id: 1,
      quantityWithoutPay: 0,
      type: ExtrasTypes.COUNTERDROPDOWN,
    },
    {
      id: 2,
      quantityWithoutPay: 0,
      type: ExtrasTypes.COUNTERSIMPLE,
    },
    {
      id: 3,
      quantityWithoutPay: 0,
      type: ExtrasTypes.CHECKSIMPLE,
    },
    {
      id: 4,
      quantityWithoutPay: 0,
      type: ExtrasTypes.CHECKSIMPLE,
    },
    {
      id: 5,
      quantityWithoutPay: 1,
      type: ExtrasTypes.OPTIONDROPDOWN,
    },
    {
      id: 7,
      quantityWithoutPay: 0,
      type: ExtrasTypes.CHECKSIMPLE,
    },
    {
      id: 8,
      quantityWithoutPay: 0,
      type: ExtrasTypes.CHECKSIMPLE,
      typeWithOptions: ExtrasTypes.COUNTERDROPDOWN,
    },
    {
      id: 9,
      quantityWithoutPay: 1,
      type: ExtrasTypes.SELECTION,
    },
    {
      id: 10,
      quantityWithoutPay: 0,
      type: ExtrasTypes.CHECKSIMPLE,
    },
    {
      id: 11,
      quantityWithoutPay: 0,
      type: ExtrasTypes.CHECKSIMPLE,
    },
    {
      id: 12,
      quantityWithoutPay: 0,
      type: '',
    },
  ],

  modify: [
    {
      id: 1,
      quantityWithoutPay: 0,
      type: ExtrasTypes.COUNTERDROPDOWN,
    },
    {
      id: 2,
      quantityWithoutPay: 0,
      type: ExtrasTypes.COUNTERSIMPLE,
    },
    {
      id: 3,
      quantityWithoutPay: 0,
      type: ExtrasTypes.CHECKSIMPLE,
    },
    {
      id: 4,
      quantityWithoutPay: 0,
      type: ExtrasTypes.CHECKSIMPLE,
    },
    {
      id: 5,
      quantityWithoutPay: 0,
      type: ExtrasTypes.OPTIONDROPDOWN,
    },
    {
      id: 7,
      quantityWithoutPay: 0,
      type: ExtrasTypes.CHECKSIMPLE,
    },
    {
      id: 8,
      quantityWithoutPay: 0,
      type: ExtrasTypes.CHECKSIMPLE,
      typeWithOptions: ExtrasTypes.COUNTERDROPDOWN,
    },
    {
      id: 9,
      quantityWithoutPay: 1,
      type: ExtrasTypes.SELECTION,
    },
    {
      id: 10,
      quantityWithoutPay: 0,
      type: ExtrasTypes.CHECKSIMPLE,
    },
    {
      id: 11,
      quantityWithoutPay: 0,
      type: ExtrasTypes.CHECKSIMPLE,
    },
    {
      id: 12,
      quantityWithoutPay: 0,
      type: '',
    },
  ],
};
