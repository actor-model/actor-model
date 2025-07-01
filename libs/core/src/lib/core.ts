interface Core {
  msg: string
}

export function core(): Core {
  return {
    msg: 'Initialize Actor Model',
  };
}
