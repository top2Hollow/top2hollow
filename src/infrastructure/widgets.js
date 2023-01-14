import React, { Component, PureComponent } from 'react';
import ReactCodeInput from 'react-verification-code-input';
import ReactDOM from 'react-dom';

import TimeAgo from 'react-timeago';
import chineseStrings from 'react-timeago/lib/language-strings/zh-CN';
import buildFormatter from 'react-timeago/lib/formatters/buildFormatter';
import copy from 'copy-to-clipboard';

import './global.css';
import './widgets.css';
import emailExample from '../images/email_example.jpg';

import { get_json, API_VERSION_PARAM } from './functions';
import { EMAIL } from '../UserAction';

function pad2(x) {
  return x < 10 ? '0' + x : '' + x;
}
export function format_time(time) {
  return `${time.getMonth() + 1}-${pad2(
    time.getDate(),
  )} ${time.getHours()}:${pad2(time.getMinutes())}:${pad2(time.getSeconds())}`;
}
const chinese_format = buildFormatter(chineseStrings);
export function Time(props) {
  const time = new Date(props.stamp * 1000);
  return (
    <span className={'time-str'}>
      <TimeAgo
        date={time}
        formatter={chinese_format}
        title={time.toLocaleString('zh-CN', {
          timeZone: 'Asia/Shanghai',
          hour12: false,
        })}
      />
      &nbsp;
      {!props.short ? format_time(time) : null}
    </span>
  );
}

export function TitleLine(props) {
  return (
    <p className="centered-line title-line aux-margin">
      <span className="black-outline">{props.text}</span>
    </p>
  );
}

export function GlobalTitle(props) {
  return (
    <div className="aux-margin">
      <div className="title">
        <p className="centered-line">{props.text}</p>
      </div>
    </div>
  );
}

async function sha256_hex(text, l = null) {
  let hash_buffer = await window.crypto.subtle.digest('SHA-256' , new TextEncoder().encode(text));
  let hex_str = Array.from(new Uint8Array(hash_buffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
  return l ? hex_str.slice(0, l) : hex_str
}

class LoginPopupSelf extends Component {
  constructor(props) {
    super(props);
    this.state = {
      token_phrase: '',
      already_copy: false,
      email_addr: '',
      time: 10,
      btnDisable:false,
      btnContent: '发送验证码',
      code: ''
    };
    this.input = React.createRef();
  }
  setThuhole(e) {
    e.preventDefault();
    alert('T大树洞已经没有啦😭');
  }

  copy_token_hash(event) {
    const { token_phrase } = this.state;
    if (!token_phrase) {
      alert('不可以为空');
      return;
    }

    sha256_hex(token_phrase + 'hole' + new Date().toDateString(), 16)
      .then((token) => sha256_hex(token + 'hole', 16))
      .then((token_hash) => copy('|' + token_hash + '|'));

    this.setState({already_copy: true});
  }

  copy_token_phrase(event) {
    const { token_phrase } = this.state;
    if (!token_phrase) {
      alert('不可以为空');
      return;
    }
    copy(token_phrase);
  }

  use_token(event) {
    const { token_phrase } = this.state;
    if (!token_phrase) {
      alert('不可以为空');
      return;
    }

    sha256_hex(token_phrase + 'hole' + new Date().toDateString(), 16)
      .then((token) => {
        localStorage['TOKEN'] = 'sha256:' + token;
        window.location.reload();
      });
  }
  handleChange = vals => {
    if (vals.length >= 6) {
      console.log('complete, ', vals);
    } else if (vals.length === 0) {
      console.log('empty, ', vals);
    }
  };
  render() {
    const { token_phrase, already_copy, email_addr, otp } = this.state;
    let timeChange;
    let ti = this.state.time;
    const clock = ()=>{
      if (ti > 0) {
        //当ti>0时执行更新方法
         ti = ti - 1;
         this.setState({
            time: ti,
            btnContent: ti + "s之内不能再次发送验证码",
          });
         console.log(ti);
      }else{
        //当ti=0时执行终止循环方法
        clearInterval(timeChange);
        this.setState({
          btnDisable: false,
          time: 10,
          btnContent: "发送验证码",
        });
      }
    };
    const sendCode = () =>{
      this.setState({
        btnDisable: true,
        btnContent: "10s之内不能再次发送验证码",
      });
      //每隔一秒执行一次clock方法
      timeChange = setInterval(clock,1000);
    };
    let handleChange = (code) => {
      this.setState(code)
    }
    return (
      <div>
        <div className="thuhole-login-popup-shadow" />
        <div className="thuhole-login-popup">
          <h3>直接邮箱登录</h3>
          <p>
            <input onChange={(event) => this.setState({ email_addr: event.target.value })} />
          </p>
          <button type="primary" className="send-verify-button" onClick={sendCode} disabled={this.state.btnDisable}>{this.state.btnContent}</button>
          <div className="verify-div">
            <ReactCodeInput
              ref={this.input}
              fieldWidth={30}
              fieldHeight={40}
              onChange={this.handleChange}
              onComplete={val => console.log('complete', val)}
            />
          </div>
          <p>
            <button onClick={this.props.on_close}>取消</button>
          </p>
          <hr />
          <div className="thuhole-login-popup-info">
            <p>提醒:</p>
            <ul>
              <li>TP树洞的匿名性来自隔离用户名与发布的内容，而非试图隔离用户名与真实身份。</li>
              <li> 目前一个人可能有多个帐号。</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }
}

export class LoginPopup extends Component {
  constructor(props) {
    super(props);
    this.state = {
      popup_show: false,
    };
    this.on_popup_bound = this.on_popup.bind(this);
    this.on_close_bound = this.on_close.bind(this);
  }

  on_popup() {
    this.setState({
      popup_show: true,
    });
  }
  on_close() {
    this.setState({
      popup_show: false,
    });
  }

  render() {
    return (
      <>
        {this.props.children(this.on_popup_bound)}
        {this.state.popup_show && (
          <LoginPopupSelf
            token_callback={this.props.token_callback}
            on_close={this.on_close_bound}
          />
        )}
      </>
    );
  }
}
