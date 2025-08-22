#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// For colored terminal output
const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Page template
function getPageTemplate(componentName) {
  return `import React from "react";
import { ColorDto, useThemedStyles } from "@/theme";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

export default function ${componentName}() {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyle);
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("${componentName}")}</Text>
    </View>
  );
}

const createStyle = (colors: ColorDto) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    title: {
      color: colors.text,
    },
  });`;
}

function createPage() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    log('❌ Usage: npm run create-page <folder/file> <ComponentName>', 'red');
    log('📝 Example: npm run create-page (auth)/login LoginScreen', 'yellow');
    process.exit(1);
  }

  const filePath = args[0];
  const componentName = args[1];
  
  // Analyze file path and folder structure
  const pathParts = filePath.split('/');
  const fileName = pathParts.pop(); // Last part is file name
  const folderPath = pathParts.join('/');
  
  // Absolute path to app directory
  const appDir = path.join(process.cwd(), 'app');
  
  // Target folder path
  let targetDir = appDir;
  if (folderPath) {
    targetDir = path.join(appDir, folderPath);
  }
  
  // Target file path
  const targetFile = path.join(targetDir, fileName, 'index.tsx');
  
  try {
    // Create app directory if it doesn't exist
    if (!fs.existsSync(appDir)) {
      fs.mkdirSync(appDir, { recursive: true });
      log(`📁 App folder created: ${appDir}`, 'blue');
    }
    
    // Create target folder
    const fileDir = path.dirname(targetFile);
    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
      log(`📁 Folder created: ${fileDir}`, 'blue');
    }
    
    // Warn if file already exists
    if (fs.existsSync(targetFile)) {
      log(`⚠️  File already exists: ${targetFile}`, 'yellow');
      log('Do you want to overwrite it? (y/N)', 'yellow');
      
      // Get simple input from user
      process.stdin.resume();
      process.stdin.setEncoding('utf8');
      process.stdin.on('data', (data) => {
        const input = data.toString().trim().toLowerCase();
        if (input === 'y' || input === 'yes') {
          writeFile();
        } else {
          log('❌ Operation cancelled.', 'red');
          process.exit(0);
        }
      });
      return;
    }
    
    writeFile();
    
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    process.exit(1);
  }
  
  function writeFile() {
    // Generate template and write to file
    const template = getPageTemplate(componentName);
    fs.writeFileSync(targetFile, template, 'utf8');
    
    log(`✅ Page successfully created!`, 'green');
    log(`📄 File: ${targetFile}`, 'blue');
    log(`🏷️  Component: ${componentName}`, 'blue');
    
    process.exit(0);
  }
}

// Run script
createPage();
