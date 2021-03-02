# Homebridge plugin for sHome
## 소개
이 [HomeBridge](https://github.com/homebridge/homebridge) 플러그인은 Apple의 [HomeKit](http://www.apple.com/ios/home/)에 Samsung SDS의 sHome에 연결된 악세사리를 추가할 수 있도록 도와줍니다.  
homebridge-shome이 활성화되면 다음 유형의 장치를 입력한 sHome 계정에서 검색하여 Homebridge 악세사리로 추가합니다.

    - 에어컨
    - 도어락
    - 조명

## 설치
1. Homebridge를 설치하세요.
2. Homebridge Config UI X에서 homebridge-shome을 설치하거나 다음 명령어를 입력하세요.
<pre><code>npm i -g homebridge-shome</code></pre>
3. config.json을 열거나 Homebridge Config UI X에서 구성으로 이동한 다음 **platforms**에 다음과 같은 구성을 추가합니다.
<pre><code>{
    "name": "shome",
    "platform": "sHomePlugin",
    "username": "<sHome 로그인 아이디>",
    "password": "<sHome 로그인 비밀번호>",
    "deviceId": "<sHome 기기 아이디>"
}
</code></pre>

이 구성을 추가했다면 다음과 비슷한 모양이 됩니다.
<pre><code>{
    "bridge": {
        "name": "Homebridge ",
        "username": "00:00:00:00:00:00",
        "port": 51223,
        "pin": "000-00-000"
    },
    "accessories": [],
    "platforms": [
        {
            "name": "Config",
            "port": 8581,
            "platform": "config"
        },
        {
            "name": "shome",
            "platform": "sHomePlugin",
            "username": "01012345678",
            "password": "p@$$w0rd",
            "deviceId": "AAAAAAAA-ABCA-CBAA-CCBA-AAAABBBBBBBB"
        }
    ]
}
</code></pre>
5. Homebridge를 재시작합니다.