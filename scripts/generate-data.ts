import fs from "fs";
import { TableData } from "../src/types/table";
import dayjs from "dayjs";

const generateRandomName = (id: number): string => {
  const firstNames = ["John", "Jane", "Alex", "Chris", "Taylor"];
  const lastNames = ["Smith", "Johnson", "Williams", "Brown"];
  const firstName = firstNames[id % firstNames.length];
  const lastName = lastNames[id % lastNames.length];
  return `${firstName} ${lastName}`;
};

const generateRandomStatus = (): "Pending" | "Approved" | "Rejected" => {
  const statuses: ("Pending" | "Approved" | "Rejected")[] = [
    "Pending",
    "Approved",
    "Rejected",
  ];
  return statuses[Math.floor(Math.random() * statuses.length)];
};

const generateRandomAmount = (): number =>
  Math.floor(Math.random() * 99999) + 1000;

const generateRandomCloseDate = (): string => {
  const randomDays = Math.floor(Math.random() * 365 * 2);
  const futureDate = dayjs().add(randomDays, "days");
  return futureDate.format("YYYY-MM-DD");
};

const generateLoan = (id: number): TableData => ({
  id,
  borrowerName: generateRandomName(id),
  amount: generateRandomAmount(),
  status: generateRandomStatus(),
  closeDate: generateRandomCloseDate(),
});

const generateLoans = (count: number): TableData[] => {
  const loans: TableData[] = [];
  for (let i = 1; i <= count; i++) {
    loans.push(generateLoan(i));
  }
  return loans;
};

const loans50000 = generateLoans(50000);

const loans100 = generateLoans(100);

fs.mkdirSync("./data", { recursive: true });

try {
  fs.writeFileSync(
    "./data/loans.json",
    JSON.stringify(loans50000, null, 2),
    "utf-8"
  );
  fs.writeFileSync(
    "./data/loans_100.json",
    JSON.stringify(loans100, null, 2),
    "utf-8"
  );
  console.log("Loan data generated and saved!");
} catch (err) {
  console.error("Failed to write loan data:", err);
  process.exitCode = 1;
}

export default generateLoan;
