const fs = require('fs'); // This is the "File System" tool (the hands)
const path = require('path'); // This helps find folders (the map)
const { exec } = require('child_process'); // This runs system commands (the voice)

class EspansoManager {
    constructor() {
        // This finds your "AppData" folder automatically on any Windows computer
        this.espansoPath = path.join(process.env.APPDATA, 'espanso', 'match');
    }

    // This function creates a personal file for a Pathologist
    syncPersonalMacro(userId, trigger, text) {
        const fileName = `user_${userId}.yml`;
        const filePath = path.join(this.espansoPath, fileName);

        // 5th Grade Style: We are building the string with the correct spaces
        const yamlContent = `matches:\n  - trigger: "${trigger}"\n    replace: "${text}"\n    force_clipboard: true`;

        // This writes the file to the Espanso folder
        fs.writeFileSync(filePath, yamlContent, 'utf8');

        // After saving, we tell Espanso to refresh
        this.reloadEspanso();
    }

    // The "Secret Command" to refresh the keyboard
    reloadEspanso() {
        exec('espanso restart', (error) => {
            if (error) {
                console.log("Could not restart Espanso. Is it installed?");
            } else {
                console.log("Espanso refreshed with new macros!");
            }
        });
    }
}

module.exports = new EspansoManager();
