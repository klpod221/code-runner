#include <stdio.h>

// Function declaration
int add(int a, int b);

int main() {
    // Simple C example
    printf("Hello, World from C!\n");
    
    // Example of reading input
    char name[50];
    printf("What is your name? ");
    scanf("%s", name);
    printf("Hello, %s!\n", name);
    
    // Example of using a function
    int result = add(5, 10);
    printf("The sum of 5 and 10 is %d\n", result);
    
    return 0;
}

// Function definition
int add(int a, int b) {
    return a + b;
}