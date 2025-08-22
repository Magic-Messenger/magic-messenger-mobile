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

// Component template
function getComponentTemplate(componentName) {
  return `import React from "react";
import { ThemedText } from "@/components";
import { ColorDto, useThemedStyles } from "@/theme";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity } from "react-native";

interface ${componentName}Props {
  title?: string;
}

export function ${componentName}({
  title = "${componentName}",
}: ${componentName}Props) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyle);

  return (
    <TouchableOpacity activeOpacity={0.8} style={[styles.pl5, styles.pr5]}>
      <ThemedText>{t(title)}</ThemedText>
    </TouchableOpacity>
  );
}

const createStyle = (colors: ColorDto) => StyleSheet.create({});`;
}

function createComponent() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    log('❌ Usage: npm run create-component <folder/file> <ComponentName>', 'red');
    log('📝 Example: npm run create-component ui/Button Button', 'yellow');
    process.exit(1);
  }

  const filePath = args[0];
  const componentName = args[1];
  
  // Analyze file path and folder structure
  const pathParts = filePath.split('/');
  const fileName = pathParts.pop(); // Last part is file name
  const folderPath = pathParts.join('/');
  
  // Absolute path to components folder
  const componentsDir = path.join(process.cwd(), 'components');
  
  // Target folder path
  let targetDir = componentsDir;
  if (folderPath) {
    targetDir = path.join(componentsDir, folderPath);
  }
  
  // Target file path
  const targetFile = path.join(targetDir, fileName, 'index.tsx');
  
  try {
    // Create components folder if it doesn't exist
    if (!fs.existsSync(componentsDir)) {
      fs.mkdirSync(componentsDir, { recursive: true });
      log(`📁 Components folder created: ${componentsDir}`, 'blue');
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
      
      // Simple input from user
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
    const template = getComponentTemplate(componentName);
    fs.writeFileSync(targetFile, template, 'utf8');
    
    log(`✅ Component successfully created!`, 'green');
    log(`📄 File: ${targetFile}`, 'blue');
    log(`🏷️  Component: ${componentName}`, 'blue');
    
    process.exit(0);
  }
}

// Run script
createComponent();
