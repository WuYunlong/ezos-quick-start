import fs from 'node:fs'
import path from 'node:path'
import minimist from 'minimist'
import prompts from 'prompts'
import colors from 'picocolors'
import { fileURLToPath } from 'node:url'

const argv = minimist<{
  t?: string
  template?: string
}>(process.argv.slice(2), { string: ['_'] })

const cwd = process.cwd()

const renameFiles: Record<string, string | undefined> = {
  _gitignore: '.gitignore'
}

const TEMPLATES: string = ['vue-ts']

const defaultTargetDir = 'project'

const formatTargetDir = (targetDir: string | undefined) => {
  return targetDir?.trim().replace(/\/+$/g, '')
}

const isEmpty = (path: string): boolean => {
  const files = fs.readdirSync(path)
  return files.length === 0 || (files.length === 1 && files[0] === '.git')
}

const pkgFromUserAgent = (userAgent: string | undefined) => {
  if (!userAgent) return undefined
  const pkgSpec = userAgent.split(' ')[0]
  const pkgSpecArr = pkgSpec.split('/')
  return {
    name: pkgSpecArr[0],
    version: pkgSpecArr[1]
  }
}

const copy = (src: string, dest: string) => {
  const stat = fs.statSync(src)
  if (stat.isDirectory()) {
    copyDir(src, dest)
  } else {
    fs.copyFileSync(src, dest)
  }
}

const copyDir = (srcDir: string, destDir: string) => {
  fs.mkdirSync(destDir, { recursive: true })
  for (const file of fs.readdirSync(srcDir)) {
    const srcFile = path.resolve(srcDir, file)
    const destFile = path.resolve(destDir, file)
    copy(srcFile, destFile)
  }
}

const isValidPackageName = (projectName: string) => {
  return /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(
    projectName
  )
}

const toValidPackageName = (projectName: string) => {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]/, '')
    .replace(/[^a-z0-9-~]+/g, '-')
}

const emptyDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    return
  }
  for (const file of fs.readdirSync(dir)) {
    if (file === '.git') {
      continue
    }
    fs.rmSync(path.resolve(dir, file), { recursive: true, force: true })
  }
}

async function init() {
  const argTargetDir = formatTargetDir(argv._[0])
  const argTemplate = argv.template || argv.t

  let targetDir = argTargetDir || defaultTargetDir

  const getProjectName = () => {
    return targetDir === '.' ? path.basename(path.resolve()) : targetDir
  }

  let result: prompts.Answers<
    'projectName' | 'overwrite' | 'template' | 'packageName'
  >

  try {
    result = await prompts(
      [
        {
          type: argTargetDir ? null : 'text',
          name: 'projectName',
          message: colors.reset('Project name:'),
          initial: defaultTargetDir,
          onState: (state) => {
            targetDir = formatTargetDir(state.value) || defaultTargetDir
          }
        },
        {
          type: () =>
            !fs.existsSync(targetDir) || isEmpty(targetDir) ? null : 'confirm',
          name: 'overwrite',
          message: () => {
            const msg = targetDir === '.' ? '当前目录' : `目录 ${targetDir} `
            return `${msg}不为空 删除现有文件并继续`
          }
        },
        {
          type: argTemplate && TEMPLATES.include(argTemplate) ? null : 'select',
          name: 'template',
          message: () => {
            let msg = `请选择模版:`
            if (argTemplate === 'string' && !TEMPLATES.includes(argTemplate)) {
              msg = `您选择的模版不正确 ${argTemplate} 请选择正确的模版`
            }
            return colors.reset(msg)
          },
          initial: 0,
          choices: [
            {
              title: 'vue',
              value: 'vue'
            },
            {
              title: 'vue-ts',
              value: 'vue-ts'
            },
            {
              title: 'react',
              value: 'react'
            },
            {
              title: 'react-ts',
              value: 'react-ts'
            }
          ]
        },
        {
          type: () => (isValidPackageName(getProjectName()) ? null : 'text'),
          name: 'packageName',
          message: colors.reset('包名称:'),
          initial: () => toValidPackageName(getProjectName()),
          validate: (dir) => {
            return isValidPackageName(dir) || 'Invalid package.json name'
          }
        }
      ],
      {
        onCancel: () => {
          throw new Error(colors.red('✖') + ' 您的操作已取消')
        }
      }
    )
  } catch (e) {
    console.log(e.message)
    return
  }

  const { overwrite, template, packageName } = result
  const root = path.join(cwd, targetDir)

  if (overwrite) {
    emptyDir(root)
  } else {
    fs.mkdirSync(root, { recursive: true })
  }

  const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent)
  const pkgManager = pkgInfo ? pkgInfo.name : 'npm'
  // const isYarn1 = pkgManager === 'yarn' && pkgInfo?.version.startsWith("1.")

  const templateDir = path.resolve(
    fileURLToPath(import.meta.url),
    '../../template',
    template
  )

  const write = (file: string, content?: string) => {
    const targetPath = path.join(root, renameFiles[file] ?? file)
    if (content) {
      fs.writeFileSync(targetPath, content)
    } else {
      copy(path.join(templateDir, file), targetPath)
    }
  }

  const files = fs.readdirSync(templateDir)
  for (const file of files.filter((f) => f !== 'package.json')) {
    write(file)
  }

  const pkg = JSON.parse(
    fs.readFileSync(path.join(templateDir, `package.json`), 'utf-8')
  )

  pkg.name = packageName || getProjectName()

  write('package.json', JSON.stringify(pkg, null, 2))

  if (root !== cwd) {
    console.log(`  cd ${path.relative(cwd, root)}`)
  }

  switch (pkgManager) {
    case 'yarn':
      console.log('  yarn')
      console.log('  yarn dev')
      break
    default:
      console.log(`  ${pkgManager} install`)
      console.log(`  ${pkgManager} run dev`)
      break
  }

  console.log()
}

init().catch((e) => {
  console.error(e)
})
