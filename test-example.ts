// Example file to test the review agent

const API_KEY = "hardcoded-secret-key-12345"; // Security issue!

function getUserData(userId: string) {
  // Potential SQL injection
  const query = "SELECT * FROM users WHERE id = " + userId;

  // Duplicated code
  if (userId === "1") {
    console.log("User 1 found");
    console.log("Fetching data...");
    return { id: 1, name: "John" };
  }

  // Duplicated code again
  if (userId === "2") {
    console.log("User 2 found");
    console.log("Fetching data...");
    return { id: 2, name: "Jane" };
  }

  return null;
}

// Another function with issues
function processOrder(order) { // Missing type
  // No error handling
  const total = order.items.reduce((sum, item) => {
    return sum + item.price;
  }, 0);

  // Hardcoded value
  if (total > 100) {
    return total * 0.9; // Magic number
  }

  return total;
}

export { getUserData, processOrder };
