export const STATE_CODES = [
  { value: "1", label: "JAMMU AND KASHMIR" },
  { value: "2", label: "HIMACHAL PRADESH" },
  { value: "3", label: "PUNJAB" },
  { value: "4", label: "CHANDIGARH" },
  { value: "5", label: "UTTARAKHAND" },
  { value: "6", label: "HARYANA" },
  { value: "7", label: "DELHI" },
  { value: "8", label: "RAJASTHAN" },
  { value: "9", label: "UTTAR PRADESH" },
  { value: "10", label: "BIHAR" },
  { value: "11", label: "SIKKIM" },
  { value: "12", label: "ARUNACHAL PRADESH" },
  { value: "13", label: "NAGALAND" },
  { value: "14", label: "MANIPUR" },
  { value: "15", label: "MIZORAM" },
  { value: "16", label: "TRIPURA" },
  { value: "17", label: "MEGHALAYA" },
  { value: "18", label: "ASSAM" },
  { value: "19", label: "WEST BENGAL" },
  { value: "20", label: "JHARKHAND" },
  { value: "21", label: "ODISHA" },
  { value: "22", label: "CHHATTISGARH" },
  { value: "23", label: "MADHYA PRADESH" },
  { value: "24", label: "GUJARAT" },
  { value: "25", label: "DAMAN AND DIU" },
  { value: "26", label: "DADRA AND NAGAR HAVELI" },
  { value: "27", label: "MAHARASHTRA" },
  { value: "29", label: "KARNATAKA" },
  { value: "30", label: "GOA" },
  { value: "31", label: "LAKSHADWEEP" },
  { value: "32", label: "KERALA" },
  { value: "33", label: "TAMIL NADU" },
  { value: "34", label: "PUDUCHERRY" },
  { value: "35", label: "ANDAMAN AND NICOBAR" },
  { value: "36", label: "TELANGANA" },
  { value: "37", label: "ANDHRA PRADESH" },
  { value: "38", label: "LADAKH" },
  { value: "97", label: "OTHER TERRITORY" },
  { value: "96", label: "OTHER COUNTRY" },
] as const;

export const SUPPLY_TYPES = [
  { value: "B2B", label: "B2B" },
  { value: "B2C", label: "B2C" },
  { value: "SEZWP", label: "SEZ with Payment" },
  { value: "SEZWOP", label: "SEZ without Payment" },
  { value: "EXPWP", label: "Export with Payment" },
  { value: "EXPWOP", label: "Export without Payment" },
  { value: "DEXP", label: "Deemed Export" },
  { value: "O", label: "Outward" },
] as const;

export const SUB_SUPPLY_TYPES = [
  { value: "1", label: "Supply" },
  { value: "2", label: "Import" },
  { value: "3", label: "Export" },
  { value: "4", label: "Job Work" },
  { value: "5", label: "For Own Use" },
  { value: "6", label: "Job Work Returns" },
  { value: "7", label: "Sales Return" },
  { value: "8", label: "Others" },
] as const;

export const TRANSACTION_TYPES = [
  { value: "1", label: "Regular" },
  { value: "2", label: "Bill to Ship to" },
  { value: "3", label: "Bill to Dispatch from" },
  { value: "4", label: "Combination of 2 and 3" },
] as const;

export const DOCUMENT_TYPES = [
  { value: "INV", label: "Invoice" },
  { value: "CRN", label: "Credit Note" },
  { value: "DBN", label: "Debit Note" },
] as const;

export const TRANSPORT_MODES = [
  { value: "1", label: "Road" },
  { value: "2", label: "Rail" },
  { value: "3", label: "Air" },
  { value: "4", label: "Ship or Ship Cum Road/Rail" },
] as const;

export const VEHICLE_TYPES = [
  { value: "R", label: "Regular" },
  { value: "O", label: "Over Dimensional Cargo" },
] as const;
