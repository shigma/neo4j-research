const fs = require('fs')
const path = require('path')
const cp = require('child_process')

let peopleData = []
let phoneData = []
let people_phone = []
let phone_phone = []

function searchBy(_key, _value) {
    return function(arr, ...keys) {
        return keys.map(key => arr.find(item => item[_key] === key)[_value] || '').join(',')
    }
}
const search = searchBy('key', 'value')

function getValue(arr, key, _key, _value) {
    return arr.find(item => item[_key] === key)[_value] || ''
}

function load(dir, outdir) {
    if (!fs.existsSync(outdir)) fs.mkdirSync(outdir)

    const dataset = fs.readdirSync(dir).map(filename => {
        return JSON.parse(fs.readFileSync(path.join(dir, filename), {encoding: 'utf8'}))
    })
    
    dataset.forEach(data => {
        const uid = search(data.report.user_basic, 'id_card')
        if (peopleData.findIndex(people => people.startsWith(uid + ',')) === -1) {
            console.log(getValue(data.report.basic_check_items, 'is_name_and_idcard_in_finance_black', 'check_item', 'result'))
            peopleData.push(
                search(data.report.user_basic, 'id_card', 'name', 'gender', 'age', 'province', 'city', 'region') + ',People' +
                (getValue(data.report.basic_check_items, 'is_name_and_idcard_in_court_black', 'check_item', 'result') === '是' ? ';Court_Black' : '') +
                (getValue(data.report.basic_check_items, 'is_name_and_idcard_in_finance_black', 'check_item', 'result') === '是' ? ';Finance_Black' : '')
            )
        }
        const pid = search(data.report.cell_phone, 'mobile')
        if (phoneData.findIndex(phone => phone.startsWith(pid + ',')) === -1) {
            phoneData.push(search(data.report.cell_phone, 'mobile', 'package_name') + ',Phone')
        }
        const upid = search(data.report.user_basic, 'id_card') + ',' + search(data.report.cell_phone, 'mobile')
        if (people_phone.findIndex(pp => pp.startsWith(upid + ',')) === -1) {
            people_phone.push(upid + ',Belongs')
        }
    })

    const length = dataset.length
    let progress = 0

    dataset.forEach((data, index) => {
        if (progress < Math.floor(index / length * 100)) {
            progress = Math.floor(index / length * 100)
        }
        const pid = search(data.report.cell_phone, 'mobile')
        ;[].concat(...data.voiceList.list.map(month => month.calls)).forEach(call => {
            if (call.duration === 0) return
            if (call.peer_number.length !== 11 && call.peer_number.length !== 12) return
            if (phoneData.findIndex(phone => phone.startsWith(call.peer_number + ',')) === -1) {
                phoneData.push(call.peer_number + ',暂无相关资料,Phone')
            }
            phone_phone.push(`${
                call.dial_type === 'DIAL' ? pid + ',' + call.peer_number : call.peer_number + ',' + pid
            },${call.duration},${(new Date(call.time) - new Date('2016-1-1')) / 1000},Call`)
        })
    })

    fs.writeFileSync(
        path.join(outdir, 'people.csv'),
        'id_card:ID(People),name,gender,age:INT,province,city,region,:LABEL\n' + peopleData.join('\n')
    )
    fs.writeFileSync(
        path.join(outdir, 'phone.csv'),
        'phone_id:ID(Phone),package,:LABEL\n' + phoneData.join('\n')
    )
    fs.writeFileSync(
        path.join(outdir, 'people-phone.csv'),
        ':START_ID(People),:END_ID(Phone),:TYPE\n' + people_phone.join('\n')
    )
    fs.writeFileSync(
        path.join(outdir, 'phone-phone.csv'),
        ':START_ID(Phone),:END_ID(Phone),duration:INT,time:INT,:TYPE\n' + phone_phone.join('\n')
    )

    outdir = path.join(__dirname, outdir)
}

load('source', 'output')

// console.log(people_phone)
