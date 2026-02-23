import { Client } from 'ssh2';

export interface SSHConfig {
  host: string;
  port?: number;
  username: string;
  password: string;
}

export interface SSHResult {
  success: boolean;
  output?: string;
  error?: string;
}

export class SSHHelper {
  async executeCommand(config: SSHConfig, command: string): Promise<SSHResult> {
    return new Promise((resolve) => {
      const conn = new Client();
      let output = '';
      let errorOutput = '';

      conn.on('ready', () => {
        console.log('[SSH] Connected, executing command...');
        
        conn.exec(command, (err, stream) => {
          if (err) {
            conn.end();
            resolve({ success: false, error: err.message });
            return;
          }

          stream.on('close', (code: number) => {
            conn.end();
            if (code === 0) {
              resolve({ success: true, output });
            } else {
              resolve({ success: false, error: errorOutput || `Exit code: ${code}` });
            }
          }).on('data', (data: Buffer) => {
            output += data.toString();
          }).stderr.on('data', (data: Buffer) => {
            errorOutput += data.toString();
          });
        });
      }).on('error', (err) => {
        resolve({ success: false, error: err.message });
      }).connect({
        host: config.host,
        port: config.port || 22,
        username: config.username,
        password: config.password,
        readyTimeout: 10000,
      });
    });
  }

  async createProxmoxToken(
    config: SSHConfig,
    user: string,
    tokenName: string
  ): Promise<{ success: boolean; token?: string; error?: string }> {
    // First check if token exists and delete it
    const deleteCmd = `pveum user token remove ${user} ${tokenName} 2>/dev/null || true`;
    console.log('[SSH] Executing delete command:', deleteCmd);
    await this.executeCommand(config, deleteCmd);

    // Create new token - prioritize -privsep 0 to allow full access
    // Different Proxmox versions may have different syntax
    let createCmd = `pveum user token add ${user} ${tokenName} -privsep 0 -output-format json`;
    console.log('[SSH] Executing create command (with -privsep 0 and JSON):', createCmd);
    let result = await this.executeCommand(config, createCmd);

    // Fallback 1: Try -privsep 0 without -output-format
    if (!result.success && result.error) {
      console.log('[SSH] Trying with -privsep 0 only...');
      createCmd = `pveum user token add ${user} ${tokenName} -privsep 0`;
      console.log('[SSH] Executing:', createCmd);
      result = await this.executeCommand(config, createCmd);
    }

    // Fallback 2: Try without -output-format (old syntax)
    if (!result.success && result.error) {
      console.log('[SSH] Trying without -output-format json...');
      createCmd = `pveum user token add ${user} ${tokenName}`;
      console.log('[SSH] Executing:', createCmd);
      result = await this.executeCommand(config, createCmd);
    }

    // Fallback 3: Try basic syntax with -output-format json
    if (!result.success && result.error) {
      console.log('[SSH] Trying with -output-format json...');
      createCmd = `pveum user token add ${user} ${tokenName} -output-format json`;
      console.log('[SSH] Executing:', createCmd);
      result = await this.executeCommand(config, createCmd);
    }

    console.log('[SSH] Create token result:', {
      success: result.success,
      error: result.error,
      outputLength: result.output?.length,
      outputPreview: result.output?.substring(0, 300)
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    try {
      // Parse JSON output to get token value
      const lines = result.output?.split('\n') || [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('{')) {
          try {
            const json = JSON.parse(trimmed);
            console.log('[SSH] Parsed JSON token:', JSON.stringify(json));
            if (json.value) {
              return { success: true, token: json.value };
            }
          } catch (parseErr) {
            console.error('[SSH] Failed to parse JSON line:', parseErr, trimmed);
          }
        }
      }

      // Fallback: try to parse the entire output looking for UUID pattern
      // Token value is typically a UUID like: 12345678-1234-1234-1234-123456789012
      const fullToken = result.output?.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i)?.[1];
      if (fullToken) {
        console.log('[SSH] Extracted token via UUID regex:', fullToken);
        return { success: true, token: fullToken };
      }

      // Last fallback: look for "value" key in output
      const valueMatch = result.output?.match(/value['\"]?\s*[=:]\s*['\"]?([a-f0-9\-]+)['\"]?/i)?.[1];
      if (valueMatch) {
        console.log('[SSH] Extracted token from value key:', valueMatch);
        return { success: true, token: valueMatch };
      }

      return { success: false, error: 'Could not parse token from output. Output was: ' + result.output };
    } catch (error) {
      return { 
        success: false, 
        error: `Failed to parse token: ${error}. Output: ${result.output}` 
      };
    }
  }
}
