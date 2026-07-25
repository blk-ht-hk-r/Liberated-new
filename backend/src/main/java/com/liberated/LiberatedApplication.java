package com.liberated;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class LiberatedApplication {

    public static void main(String[] args) {
        SpringApplication.run(LiberatedApplication.class, args);
    }
}
