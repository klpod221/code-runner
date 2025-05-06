#include <iostream>
#include <string>

// Function declaration
int add(int a, int b);

int main() {
    // Simple C++ example
    std::cout << "Hello, World from C++!" << std::endl;
    
    // Example of reading input
    std::string name;
    std::cout << "What is your name? ";
    std::cin >> name;
    std::cout << "Hello, " << name << "!" << std::endl;
    
    // Example of using a function
    int result = add(5, 10);
    std::cout << "The sum of 5 and 10 is " << result << std::endl;
    
    return 0;
}

// Function definition
int add(int a, int b) {
    return a + b;
}