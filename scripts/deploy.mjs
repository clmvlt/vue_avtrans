#!/usr/bin/env node
/**
 * Script de déploiement automatisé pour VuePointage
 * Compile le projet Vue et le déploie sur le serveur de production via SSH
 *
 * Usage: npm run deploy
 */

import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { execSync } from 'node:child_process'
import { Client } from 'ssh2'

// ── Configuration ──────────────────────────────────────────────
const CONFIG = {
  host: 'movix.fr',
  port: 22,
  username: 'debian',
  password: 'wu^eGjU7zOeZ7P#mhBw@',
  localDistPath: './dist',
  remoteWebPath: '/var/www/html/pointage',
  remoteBackupPath: '/var/www/html/pointage_backup',
}

const REMOTE_TAR = '/tmp/pointage-deploy.tar.gz'

// ── Helpers ────────────────────────────────────────────────────
function printStep(name) {
  console.log(`\n${'='.repeat(50)}`)
  console.log(`  ${name}`)
  console.log(`${'='.repeat(50)}`)
}

function exec(cmd, description) {
  console.log(`  ${description}`)
  try {
    execSync(cmd, { stdio: 'inherit' })
    return true
  } catch {
    return false
  }
}

function remoteExec(conn, cmd, description) {
  return new Promise((resolve) => {
    if (description) console.log(`  ${description}`)
    conn.exec(cmd, (err, stream) => {
      if (err) {
        console.error(`  Erreur: ${err.message}`)
        resolve(false)
        return
      }
      let output = ''
      stream.on('data', (data) => { output += data.toString() })
      stream.stderr.on('data', (data) => { process.stderr.write(data) })
      stream.on('close', (code) => {
        if (output.trim()) console.log(`  ${output.trim()}`)
        resolve(code === 0)
      })
    })
  })
}

/** Upload un fichier local vers le serveur via SFTP */
function sftpUpload(conn, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err)
      console.log(`  Upload ${remotePath}...`)
      sftp.fastPut(localPath, remotePath, (err) => {
        sftp.end()
        if (err) return reject(err)
        console.log('  Upload terminé')
        resolve()
      })
    })
  })
}

// ── Main ───────────────────────────────────────────────────────
async function deploy() {
  printStep('DEPLOIEMENT AUTOMATISE VUEPOINTAGE')
  console.log(`  Serveur: ${CONFIG.host}`)
  console.log(`  Destination: ${CONFIG.remoteWebPath}`)
  const start = Date.now()

  // ── Build ──
  printStep('COMPILATION DU PROJET VUE')

  if (!existsSync('package.json')) {
    console.error('  package.json non trouvé. Lancez depuis la racine du projet.')
    process.exit(1)
  }

  if (!existsSync('node_modules')) {
    if (!exec('npm install', 'Installation des dépendances npm...')) process.exit(1)
  }

  if (!exec('npm run build', 'Build de production...')) process.exit(1)

  if (!existsSync(CONFIG.localDistPath)) {
    console.error("  Le dossier dist n'a pas été généré.")
    process.exit(1)
  }

  // Taille du build
  let totalSize = 0
  const measure = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name)
      if (entry.isDirectory()) measure(p)
      else totalSize += statSync(p).size
    }
  }
  measure(CONFIG.localDistPath)
  console.log(`  Build généré: ${(totalSize / 1024 / 1024).toFixed(1)} MB`)

  // ── Créer l'archive tar ──
  printStep('CREATION DE L\'ARCHIVE')
  const localTar = join(CONFIG.localDistPath, '..', 'deploy.tar.gz')
  if (!exec(`tar -czf "${localTar}" -C "${CONFIG.localDistPath}" .`, 'Compression du build...')) {
    process.exit(1)
  }
  const tarSize = (statSync(localTar).size / 1024 / 1024).toFixed(1)
  console.log(`  Archive: ${tarSize} MB`)

  // ── Déploiement SSH ──
  printStep('DEPLOIEMENT SUR LE SERVEUR')

  const conn = new Client()

  await new Promise((resolve, reject) => {
    conn.on('ready', async () => {
      try {
        console.log('  Connexion SSH établie')

        // Upload tar vers /tmp (toujours accessible en écriture)
        await sftpUpload(conn, localTar, REMOTE_TAR)

        // Backup du site actuel
        await remoteExec(conn,
          `rm -rf ${CONFIG.remoteBackupPath} && cp -r ${CONFIG.remoteWebPath} ${CONFIG.remoteBackupPath} 2>/dev/null || echo 'Pas de site existant'`,
          'Sauvegarde du site actuel...',
        )

        // Nettoyage
        await remoteExec(conn,
          `rm -rf ${CONFIG.remoteWebPath}/*`,
          'Nettoyage du répertoire distant...',
        )

        // Extraction de l'archive
        await remoteExec(conn,
          `tar -xzf ${REMOTE_TAR} -C ${CONFIG.remoteWebPath}`,
          'Extraction des fichiers...',
        )

        // Permissions
        await remoteExec(conn,
          `chmod -R 755 ${CONFIG.remoteWebPath}`,
          'Configuration des permissions...',
        )

        // Vérification
        await remoteExec(conn,
          `ls -la ${CONFIG.remoteWebPath}/`,
          'Vérification des fichiers...',
        )

        // Nettoyage tar distant
        await remoteExec(conn, `rm -f ${REMOTE_TAR}`)

        conn.end()
        resolve()
      } catch (err) {
        conn.end()
        reject(err)
      }
    })

    conn.on('error', (err) => {
      console.error(`  Erreur SSH: ${err.message}`)
      reject(err)
    })

    conn.connect({
      host: CONFIG.host,
      port: CONFIG.port,
      username: CONFIG.username,
      password: CONFIG.password,
      readyTimeout: 30000,
    })
  })

  // Nettoyage tar local
  execSync(`rm -f "${localTar}"`)

  // ── Résultat ──
  const elapsed = ((Date.now() - start) / 1000).toFixed(1)
  printStep('DEPLOIEMENT TERMINÉ')
  console.log(`  Déploiement réussi en ${elapsed} secondes!`)
  console.log('  https://pointage.avtrans-concept.com')
  console.log(`\n  En cas de problème, restaurez avec:`)
  console.log(`  cp -r ${CONFIG.remoteBackupPath}/* ${CONFIG.remoteWebPath}/`)
}

deploy().catch((err) => {
  console.error(`\n  Erreur fatale: ${err.message}`)
  process.exit(1)
})
