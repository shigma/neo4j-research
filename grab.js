const fs = require('fs')
const path = require('path')
const cp = require('child_process')

let idcards = []

function searchBy(_key, _value) {
    return function(arr, ...keys) {
        return keys.map(key => arr.find(item => item[_key] === key)[_value] || '').join(',')
    }
}
const search = searchBy('key', 'value')

function getValue(arr, key, _key, _value) {
    return arr.find(item => item[_key] === key)[_value] || ''
}

function grab(dir) {
    fs.readdirSync(dir).map(filename => {
        const data = JSON.parse(fs.readFileSync(path.join(dir, filename), {encoding: 'utf8'})).report
        const uid = getValue(data.user_basic, 'id_card', 'key', 'value')
        if (idcards.indexOf(uid) === -1) {
            idcards.push(uid)
        } else {
            console.log(uid)
        }
    })
}

grab('mxdata-onlineData')

// console.log(people_phone)
