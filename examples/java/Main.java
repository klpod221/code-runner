import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        // Simple Java example
        System.out.println("Hello, World from Java!");
        
        // Example of reading input
        Scanner scanner = new Scanner(System.in);
        System.out.print("What is your name? ");
        String name = scanner.nextLine();
        System.out.println("Hello, " + name + "!");
        
        // Example of a calculation
        int a = 5;
        int b = 10;
        int sum = add(a, b);
        System.out.println("The sum of " + a + " and " + b + " is " + sum);
        
        scanner.close();
    }
    
    // Example of a method
    public static int add(int a, int b) {
        return a + b;
    }
}